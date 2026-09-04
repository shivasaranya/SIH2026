import os
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd
from app.core.config import settings
from app.demographics.schemas import (
    DistrictDemographicSummary,
    StateDemographicSummary,
    MandalDemographicSummary,
    DistrictDetailResponse
)

class DemographicsService:
    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._state_summary: Optional[StateDemographicSummary] = None
        self._district_summaries: Dict[str, DistrictDemographicSummary] = {}
        self._district_details: Dict[str, DistrictDetailResponse] = {}

    def _load_data(self):
        if self._df is not None:
            return

        csv_path = settings.PROCESSED_CENSUS_DIR / "ap_village_demographics.csv"
        if not csv_path.exists():
            raise FileNotFoundError(f"Demographics dataset not found at {csv_path}")

        df = pd.read_csv(csv_path)
        self._df = df

        # Build district summaries
        grouped = df.groupby(['current_district_code', 'current_district_name'])
        district_list: List[DistrictDemographicSummary] = []

        for (did, dname), grp in grouped:
            pop = int(grp['population_total'].sum())
            hh = int(grp['households'].sum())
            p06 = int(grp['population_0_6'].sum())
            sc = int(grp['population_sc'].sum())
            st = int(grp['population_st'].sum())
            workers = int(grp['workers'].sum())
            villages = int(len(grp))
            mandals = int(grp['mandal_code'].nunique())

            p06_pct = round((p06 / pop * 100) if pop > 0 else 0.0, 2)
            sc_pct = round((sc / pop * 100) if pop > 0 else 0.0, 2)
            st_pct = round((st / pop * 100) if pop > 0 else 0.0, 2)

            d_summary = DistrictDemographicSummary(
                district_id=str(did),
                district_name=str(dname),
                total_population=pop,
                total_households=hh,
                children_0_6=p06,
                children_0_6_pct=p06_pct,
                sc_population=sc,
                sc_pct=sc_pct,
                st_population=st,
                st_pct=st_pct,
                workers=workers,
                village_count=villages,
                mandal_count=mandals,
                data_year=2011,
                data_source="Census of India 2011 Primary Census Abstract"
            )
            district_list.append(d_summary)
            self._district_summaries[str(did)] = d_summary

            # Pre-compute mandal details for this district
            mandal_grp = grp.groupby(['mandal_code', 'mandal_name'])
            mandal_list: List[MandalDemographicSummary] = []
            for (mcode, mname), mdf in mandal_grp:
                mpop = int(mdf['population_total'].sum())
                mhh = int(mdf['households'].sum())
                mp06 = int(mdf['population_0_6'].sum())
                msc = int(mdf['population_sc'].sum())
                mst = int(mdf['population_st'].sum())
                mworkers = int(mdf['workers'].sum())
                mvillages = int(len(mdf))

                mandal_list.append(MandalDemographicSummary(
                    mandal_code=int(mcode),
                    mandal_name=str(mname),
                    current_district_id=str(did),
                    current_district_name=str(dname),
                    total_population=mpop,
                    total_households=mhh,
                    children_0_6=mp06,
                    children_0_6_pct=round((mp06 / mpop * 100) if mpop > 0 else 0.0, 2),
                    sc_population=msc,
                    sc_pct=round((msc / mpop * 100) if mpop > 0 else 0.0, 2),
                    st_population=mst,
                    st_pct=round((mst / mpop * 100) if mpop > 0 else 0.0, 2),
                    workers=mworkers,
                    village_count=mvillages
                ))

            # Sort mandals by population descending
            mandal_list.sort(key=lambda x: x.total_population, reverse=True)
            self._district_details[str(did)] = DistrictDetailResponse(
                district=d_summary,
                mandals=mandal_list
            )

        # Sort districts alphabetically by name
        district_list.sort(key=lambda x: x.district_name)

        # Statewide totals
        tot_pop = int(df['population_total'].sum())
        tot_hh = int(df['households'].sum())
        tot_p06 = int(df['population_0_6'].sum())
        tot_sc = int(df['population_sc'].sum())
        tot_st = int(df['population_st'].sum())
        tot_workers = int(df['workers'].sum())
        tot_villages = int(len(df))
        tot_districts = len(district_list)

        self._state_summary = StateDemographicSummary(
            state_name="Andhra Pradesh",
            state_code="AP",
            data_year=2011,
            data_source="Census of India 2011 Primary Census Abstract",
            total_population=tot_pop,
            total_households=tot_hh,
            total_children_0_6=tot_p06,
            total_children_0_6_pct=round((tot_p06 / tot_pop * 100) if tot_pop > 0 else 0.0, 2),
            total_sc=tot_sc,
            total_sc_pct=round((tot_sc / tot_pop * 100) if tot_pop > 0 else 0.0, 2),
            total_st=tot_st,
            total_st_pct=round((tot_st / tot_pop * 100) if tot_pop > 0 else 0.0, 2),
            total_workers=tot_workers,
            total_villages=tot_villages,
            total_districts=tot_districts,
            districts=district_list
        )

    def get_state_summary(self) -> StateDemographicSummary:
        self._load_data()
        return self._state_summary

    def get_district_summary(self, district_id: str) -> Optional[DistrictDetailResponse]:
        self._load_data()
        did_clean = district_id.strip().lower()
        return self._district_details.get(did_clean)

demographics_service = DemographicsService()
